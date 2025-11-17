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
  // Google 전략이 등록되어 있는지 확인
  if (!passport._strategies || !passport._strategies.google) {
    return res.status(503).json({ 
      message: 'Google 소셜 로그인이 설정되지 않았습니다. GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET 환경 변수를 확인해주세요.' 
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
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
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        // 에러 발생 시 프론트엔드로 리다이렉트
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
      if (!user) {
        // 사용자 인증 실패 시 프론트엔드로 리다이렉트
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }
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
  // Kakao 전략이 등록되어 있는지 확인
  if (!passport._strategies || !passport._strategies.kakao) {
    return res.status(503).json({ 
      message: 'Kakao 소셜 로그인이 설정되지 않았습니다. KAKAO_CLIENT_ID와 KAKAO_CLIENT_SECRET 환경 변수를 확인해주세요.' 
    });
  }
  passport.authenticate('kakao')(req, res, next);
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
    passport.authenticate('kakao', { session: false }, (err, user, info) => {
      if (err) {
        // 에러 발생 시 프론트엔드로 리다이렉트
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed`);
      }
      if (!user) {
        // 사용자 인증 실패 시 프론트엔드로 리다이렉트
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=kakao_auth_failed`);
      }
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
  // Naver 전략이 등록되어 있는지 확인
  if (!passport._strategies || !passport._strategies.naver) {
    return res.status(503).json({ 
      message: 'Naver 소셜 로그인이 설정되지 않았습니다. NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경 변수를 확인해주세요.' 
    });
  }
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
