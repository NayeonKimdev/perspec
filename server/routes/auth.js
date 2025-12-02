const express = require('express');
const { body } = require('express-validator');
const passport = require('../config/passport');
const { register, login, verifyEmail, resendVerificationEmail, requestPasswordReset, resetPassword, googleCallback, kakaoCallback, naverCallback } = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: 인증
 *   description: 사용자 인증 관련 API
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 회원가입
 *     tags: [인증]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: 비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다
 *                 example: Password123
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 회원가입이 완료되었습니다.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: 이메일 중복
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: 이미 존재하는 이메일입니다.
 */
// 유효성 검사 규칙
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.')
];

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [인증]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 로그인 성공
 *                 token:
 *                   type: string
 *                   description: JWT 토큰
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: 이메일 또는 비밀번호가 올바르지 않습니다.
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
];

// 라우트
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.')
], resendVerificationEmail);
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.')
], requestPasswordReset);
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('재설정 토큰이 필요합니다.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.')
], resetPassword);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Google 소셜 로그인 시작
 *     tags: [인증]
 *     description: Google OAuth 인증을 시작합니다. 사용자를 Google 로그인 페이지로 리다이렉트합니다.
 *     responses:
 *       302:
 *         description: Google 로그인 페이지로 리다이렉트
 *       503:
 *         description: Google OAuth가 설정되지 않음
 */
router.get('/google', (req, res, next) => {
  const logger = require('../utils/logger');
  
  // OAuth 인증 엔드포인트는 캐시되면 안 됩니다 (매번 새로운 리다이렉트 필요)
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Google 전략이 등록되어 있는지 확인
  if (!passport._strategies || !passport._strategies.google) {
    logger.error('Google OAuth 전략이 등록되지 않음');
    return res.status(503).json({ 
      message: 'Google 소셜 로그인이 설정되지 않았습니다. GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET 환경 변수를 확인해주세요.' 
    });
  }
  
  // 디버깅: 실제 redirect_uri 확인
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback';
  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'perspec.co.kr';
  const fullCallbackURL = callbackURL.startsWith('http') 
    ? callbackURL 
    : `${protocol}://${host}${callbackURL}`;
  
  logger.info('Google OAuth 요청', {
    callbackURL: callbackURL,
    fullCallbackURL: fullCallbackURL,
    protocol: req.protocol,
    host: req.get('host'),
    'x-forwarded-proto': req.get('x-forwarded-proto'),
    'x-forwarded-host': req.get('x-forwarded-host')
  });
  
  // passport.authenticate는 정상적으로 작동하면 자동으로 Google OAuth 페이지로 리다이렉트합니다
  // 타임아웃 설정: 5초 내에 리다이렉트가 발생하지 않으면 에러 처리
  const redirectTimeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.error('Google OAuth 리다이렉트 타임아웃 - 응답이 전송되지 않았습니다');
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=google_auth_timeout`);
    }
  }, 5000);
  
  try {
    // prompt=select_account를 추가하여 항상 계정 선택 화면 표시
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account' // 계정 선택 화면 강제 표시
    })(req, res, (err) => {
      clearTimeout(redirectTimeout);
      if (err) {
        logger.error('Google OAuth 인증 에러', {
          error: err.message,
          stack: err.stack
        });
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      // 정상적으로 작동하면 passport.authenticate가 자동으로 리다이렉트하므로 여기 도달하지 않습니다
      // 하지만 혹시 모를 경우를 대비해 에러 처리
      if (!res.headersSent) {
        logger.warn('Google OAuth: 예상치 못한 경로 도달 - 리다이렉트가 발생하지 않았습니다');
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
    });
  } catch (error) {
    clearTimeout(redirectTimeout);
    logger.error('Google OAuth 라우트 에러', {
      error: error.message,
      stack: error.stack
    });
    if (!res.headersSent) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
});

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google 소셜 로그인 콜백
 *     tags: [인증]
 *     description: Google OAuth 인증 콜백을 처리하고 JWT 토큰을 발급합니다.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Google OAuth 인증 코드
 *     responses:
 *       302:
 *         description: 프론트엔드로 리다이렉트 (토큰 포함)
 */
router.get('/google/callback', 
  (req, res, next) => {
    const logger = require('../utils/logger');
    logger.info('Google OAuth 콜백 요청', {
      query: req.query,
      code: req.query.code ? 'present' : 'missing',
      error: req.query.error,
      state: req.query.state ? 'present' : 'missing',
      fullUrl: req.originalUrl,
      headers: {
        'user-agent': req.get('user-agent'),
        'referer': req.get('referer')
      }
    });
    
    // Google에서 에러를 반환한 경우
    if (req.query.error) {
      logger.error('Google OAuth 콜백 - Google에서 에러 반환', {
        error: req.query.error,
        error_description: req.query.error_description,
        error_uri: req.query.error_uri
      });
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed&reason=${encodeURIComponent(req.query.error)}`);
    }
    
    // 인증 코드가 없는 경우
    if (!req.query.code) {
      logger.warn('Google OAuth 콜백 - 인증 코드 없음', {
        query: req.query
      });
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed&reason=no_code`);
    }
    
    // Google 전략이 등록되어 있는지 확인
    if (!passport._strategies || !passport._strategies.google) {
      logger.error('Google OAuth 콜백 - Google 전략이 등록되지 않음');
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed&reason=strategy_not_registered`);
    }
    
    // passport.authenticate 호출 전 설정 확인
    const googleStrategy = passport._strategies.google;
    logger.info('Google OAuth 콜백 - passport.authenticate 호출 전', {
      hasGoogleStrategy: true,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      clientID: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'present' : 'missing',
      code: req.query.code ? req.query.code.substring(0, 20) + '...' : 'missing',
      strategyCallbackURL: googleStrategy._oauth2 ? googleStrategy._oauth2._redirectURI : 'unknown'
    });
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        logger.error('Google OAuth 콜백 인증 에러', {
          error: err.message,
          errorName: err.name,
          stack: err.stack,
          info: info,
          query: req.query,
          // OAuth 관련 에러인 경우 추가 정보
          oauthError: err.oauthError || null,
          statusCode: err.statusCode || null
        });
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&reason=auth_error`);
      }
      if (!user) {
        logger.warn('Google OAuth 콜백 - 사용자 정보 없음', {
          info: info,
          query: req.query
        });
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&reason=no_user`);
      }
      logger.info('Google OAuth 콜백 성공 - 사용자 정보 설정', {
        userId: user.id,
        email: user.email
      });
      // 인증 성공 시 req.user에 사용자 정보 설정
      req.user = user;
      next();
    })(req, res, next);
  },
  googleCallback
);

/**
 * @swagger
 * /api/v1/auth/kakao:
 *   get:
 *     summary: Kakao 소셜 로그인 시작
 *     tags: [인증]
 *     description: Kakao OAuth 인증을 시작합니다. 사용자를 Kakao 로그인 페이지로 리다이렉트합니다.
 *     responses:
 *       302:
 *         description: Kakao 로그인 페이지로 리다이렉트
 *       503:
 *         description: Kakao OAuth가 설정되지 않음
 */
router.get('/kakao', (req, res, next) => {
  const logger = require('../utils/logger');
  
  // OAuth 인증 엔드포인트는 캐시되면 안 됩니다 (매번 새로운 리다이렉트 필요)
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Kakao 전략이 등록되어 있는지 확인
  if (!passport._strategies || !passport._strategies.kakao) {
    logger.error('Kakao OAuth 전략이 등록되지 않음');
    return res.status(503).json({ 
      message: 'Kakao 소셜 로그인이 설정되지 않았습니다. KAKAO_CLIENT_ID와 KAKAO_CLIENT_SECRET 환경 변수를 확인해주세요.' 
    });
  }
  
  // 디버깅: 실제 redirect_uri 확인
  const callbackURL = process.env.KAKAO_CALLBACK_URL || '/api/v1/auth/kakao/callback';
  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'perspec.co.kr';
  const fullCallbackURL = callbackURL.startsWith('http') 
    ? callbackURL 
    : `${protocol}://${host}${callbackURL}`;
  
  logger.info('Kakao OAuth 요청', {
    callbackURL: callbackURL,
    fullCallbackURL: fullCallbackURL,
    protocol: req.protocol,
    host: req.get('host'),
    'x-forwarded-proto': req.get('x-forwarded-proto'),
    'x-forwarded-host': req.get('x-forwarded-host')
  });
  
  // passport.authenticate는 정상적으로 작동하면 자동으로 Kakao OAuth 페이지로 리다이렉트합니다
  // 타임아웃 설정: 5초 내에 리다이렉트가 발생하지 않으면 에러 처리
  const redirectTimeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.error('Kakao OAuth 리다이렉트 타임아웃 - 응답이 전송되지 않았습니다');
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=kakao_auth_timeout`);
    }
  }, 5000);
  
  try {
    passport.authenticate('kakao')(req, res, (err) => {
      clearTimeout(redirectTimeout);
      if (err) {
        logger.error('Kakao OAuth 인증 에러', {
          error: err.message,
          stack: err.stack
        });
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed`);
      }
      // 정상적으로 작동하면 passport.authenticate가 자동으로 리다이렉트하므로 여기 도달하지 않습니다
      // 하지만 혹시 모를 경우를 대비해 에러 처리
      if (!res.headersSent) {
        logger.warn('Kakao OAuth: 예상치 못한 경로 도달 - 리다이렉트가 발생하지 않았습니다');
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed`);
      }
    });
  } catch (error) {
    clearTimeout(redirectTimeout);
    logger.error('Kakao OAuth 라우트 에러', {
      error: error.message,
      stack: error.stack
    });
    if (!res.headersSent) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed`);
    }
  }
});

/**
 * @swagger
 * /api/v1/auth/kakao/callback:
 *   get:
 *     summary: Kakao 소셜 로그인 콜백
 *     tags: [인증]
 *     description: Kakao OAuth 인증 콜백을 처리하고 JWT 토큰을 발급합니다.
 *     responses:
 *       302:
 *         description: 프론트엔드로 리다이렉트 (토큰 포함)
 */
router.get('/kakao/callback', 
  (req, res, next) => {
    const logger = require('../utils/logger');
    logger.info('Kakao OAuth 콜백 요청', {
      query: req.query,
      code: req.query.code ? 'present' : 'missing',
      error: req.query.error,
      state: req.query.state ? 'present' : 'missing',
      fullUrl: req.originalUrl,
      headers: {
        'user-agent': req.get('user-agent'),
        'referer': req.get('referer')
      }
    });
    
    // Kakao에서 에러를 반환한 경우
    if (req.query.error) {
      logger.error('Kakao OAuth 콜백 - Kakao에서 에러 반환', {
        error: req.query.error,
        error_description: req.query.error_description,
        error_uri: req.query.error_uri
      });
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed&reason=${encodeURIComponent(req.query.error)}`);
    }
    
    // 인증 코드가 없는 경우
    if (!req.query.code) {
      logger.warn('Kakao OAuth 콜백 - 인증 코드 없음', {
        query: req.query
      });
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed&reason=no_code`);
    }
    
    // Kakao 전략이 등록되어 있는지 확인
    if (!passport._strategies || !passport._strategies.kakao) {
      logger.error('Kakao OAuth 콜백 - Kakao 전략이 등록되지 않음');
      const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
      return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed&reason=strategy_not_registered`);
    }
    
    // passport.authenticate 호출 전 설정 확인
    const kakaoStrategy = passport._strategies.kakao;
    logger.info('Kakao OAuth 콜백 - passport.authenticate 호출 전', {
      hasKakaoStrategy: true,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
      clientID: process.env.KAKAO_CLIENT_ID ? process.env.KAKAO_CLIENT_ID.substring(0, 20) + '...' : 'missing',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ? 'present' : 'missing',
      code: req.query.code ? req.query.code.substring(0, 20) + '...' : 'missing'
    });
    
    passport.authenticate('kakao', { session: false }, (err, user, info) => {
      if (err) {
        logger.error('Kakao OAuth 콜백 인증 에러', {
          error: err.message,
          errorName: err.name,
          stack: err.stack,
          info: info,
          query: req.query,
          oauthError: err.oauthError || null,
          statusCode: err.statusCode || null
        });
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed&reason=auth_error`);
      }
      if (!user) {
        logger.warn('Kakao OAuth 콜백 - 사용자 정보 없음', {
          info: info,
          query: req.query
        });
        const frontendUrl = process.env.FRONTEND_URL || 'https://perspec.co.kr';
        return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed&reason=no_user`);
      }
      logger.info('Kakao OAuth 콜백 성공 - 사용자 정보 설정', {
        userId: user.id,
        email: user.email
      });
      // 인증 성공 시 req.user에 사용자 정보 설정
      req.user = user;
      next();
    })(req, res, next);
  },
  kakaoCallback
);

/**
 * @swagger
 * /api/v1/auth/naver:
 *   get:
 *     summary: Naver 소셜 로그인 시작
 *     tags: [인증]
 *     description: Naver OAuth 인증을 시작합니다. 사용자를 Naver 로그인 페이지로 리다이렉트합니다.
 *     responses:
 *       302:
 *         description: Naver 로그인 페이지로 리다이렉트
 *       503:
 *         description: Naver OAuth가 설정되지 않음
 */
router.get('/naver', (req, res, next) => {
  const logger = require('../utils/logger');
  
  // OAuth 인증 엔드포인트는 캐시되면 안 됩니다 (매번 새로운 리다이렉트 필요)
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  // Naver 전략이 등록되어 있는지 확인
  if (!passport._strategies || !passport._strategies.naver) {
    logger.error('Naver OAuth 전략이 등록되지 않음');
    return res.status(503).json({ 
      message: 'Naver 소셜 로그인이 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경 변수를 확인해주세요.' 
    });
  }
  
  logger.info('Naver OAuth 요청');
  
  // passport.authenticate는 정상적으로 작동하면 자동으로 Naver OAuth 페이지로 리다이렉트합니다
  passport.authenticate('naver')(req, res, next);
});

/**
 * @swagger
 * /api/v1/auth/naver/callback:
 *   get:
 *     summary: Naver 소셜 로그인 콜백
 *     tags: [인증]
 *     description: Naver OAuth 인증 콜백을 처리하고 JWT 토큰을 발급합니다.
 *     responses:
 *       302:
 *         description: 프론트엔드로 리다이렉트 (토큰 포함)
 */
router.get('/naver/callback', 
  (req, res, next) => {
    passport.authenticate('naver', { session: false }, (err, user, info) => {
      if (err) {
        // 에러 발생 시 프론트엔드로 리다이렉트
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=naver_auth_failed`);
      }
      if (!user) {
        // 사용자 인증 실패 시 프론트엔드로 리다이렉트
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=naver_auth_failed`);
      }
      // 인증 성공 시 req.user에 사용자 정보 설정
      req.user = user;
      next();
    })(req, res, next);
  },
  naverCallback
);

module.exports = router;
