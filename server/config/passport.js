/**
 * @fileoverview Passport 설정
 * @module config/passport
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const User = require('../models/User');
const UserSocialLogin = require('../models/UserSocialLogin');
const logger = require('../utils/logger');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// 환경 변수 로드 (여러 방법 시도)
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// dotenv가 실패한 경우 직접 파일 읽기
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([A-Z_]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].trim();
        }
      }
    });
    logger.info('환경 변수를 파일에서 직접 로드했습니다.');
  } catch (error) {
    logger.warn('환경 변수 파일 읽기 실패', { error: error.message });
  }
}

/**
 * 소셜 로그인 사용자 찾기 또는 생성 (공통 함수)
 * 같은 이메일이면 기존 계정에 연결, 없으면 새 계정 생성
 * @param {string} provider - 소셜 로그인 제공자 (google, kakao, naver)
 * @param {string} providerId - 제공자의 사용자 ID
 * @param {string} email - 사용자 이메일
 * @returns {Promise<import('../models/User')>} 사용자 객체
 */
async function findOrCreateSocialUser(provider, providerId, email) {
  // 1. 먼저 해당 provider와 provider_id로 연결된 사용자 찾기
  const existingSocialLogin = await UserSocialLogin.findOne({
    where: {
      provider,
      provider_id: providerId
    },
    include: [{
      model: User,
      as: 'user'
    }]
  });

  if (existingSocialLogin && existingSocialLogin.user) {
    logger.info(`${provider} 로그인 성공 - 기존 소셜 로그인 사용자`, {
      userId: existingSocialLogin.user.id,
      email: existingSocialLogin.user.email
    });
    return existingSocialLogin.user;
  }

  // 2. 같은 이메일로 가입한 사용자 찾기 (어떤 방식이든)
  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    // 기존 사용자에게 소셜 로그인 연결 추가
    await UserSocialLogin.create({
      user_id: existingUser.id,
      provider,
      provider_id: providerId
    });

    // 이메일 인증 자동 완료 (소셜 로그인은 자동 인증)
    if (!existingUser.email_verified) {
      await existingUser.update({ email_verified: true });
    }

    logger.info(`${provider} 로그인 성공 - 기존 계정에 연결`, {
      userId: existingUser.id,
      email: existingUser.email
    });
    return existingUser;
  }

  // 3. 새 사용자 생성
  const newUser = await User.create({
    email,
    password: null, // 소셜 로그인 사용자는 비밀번호 없음
    email_verified: true // 소셜 로그인은 자동 인증
  });

  // 소셜 로그인 연결 생성
  await UserSocialLogin.create({
    user_id: newUser.id,
    provider,
    provider_id: providerId
  });

  logger.info(`${provider} 로그인 성공 - 새 사용자 생성`, {
    userId: newUser.id,
    email: newUser.email
  });
  return newUser;
}

/**
 * Google OAuth 2.0 전략 설정
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id, emails } = profile;
          const email = emails && emails[0] ? emails[0].value : null;

          if (!email) {
            logger.warn('Google 로그인 실패 - 이메일 정보 없음', { googleId: id });
            return done(new Error('Google 계정에서 이메일 정보를 가져올 수 없습니다.'), null);
          }

          const user = await findOrCreateSocialUser('google', id, email);
          return done(null, user);
        } catch (error) {
          logger.error('Google 로그인 처리 중 오류', {
            error: error.message,
            stack: error.stack,
            googleId: profile.id
          });
          return done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth 환경 변수가 설정되지 않아 Google 로그인이 비활성화됩니다.');
}

/**
 * Kakao OAuth 2.0 전략 설정
 */
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: process.env.KAKAO_CALLBACK_URL || '/api/v1/auth/kakao/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id } = profile;
          // Kakao는 profile._json에 이메일 정보가 있음
          const email = profile._json?.kakao_account?.email || null;

          if (!email) {
            logger.warn('Kakao 로그인 실패 - 이메일 정보 없음', { kakaoId: id });
            return done(new Error('Kakao 계정에서 이메일 정보를 가져올 수 없습니다. 이메일 동의가 필요합니다.'), null);
          }

          const user = await findOrCreateSocialUser('kakao', id.toString(), email);
          return done(null, user);
        } catch (error) {
          logger.error('Kakao 로그인 처리 중 오류', {
            error: error.message,
            stack: error.stack,
            kakaoId: profile.id
          });
          return done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Kakao OAuth 환경 변수가 설정되지 않아 Kakao 로그인이 비활성화됩니다.');
}

/**
 * Naver OAuth 2.0 전략 설정
 */
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  passport.use(
    new NaverStrategy(
      {
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_CALLBACK_URL || '/api/v1/auth/naver/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { id } = profile;
          // Naver는 profile._json에 이메일 정보가 있음
          const email = profile._json?.email || profile.emails?.[0]?.value || null;

          if (!email) {
            logger.warn('Naver 로그인 실패 - 이메일 정보 없음', { naverId: id });
            return done(new Error('Naver 계정에서 이메일 정보를 가져올 수 없습니다.'), null);
          }

          const user = await findOrCreateSocialUser('naver', id, email);
          return done(null, user);
        } catch (error) {
          logger.error('Naver 로그인 처리 중 오류', {
            error: error.message,
            stack: error.stack,
            naverId: profile.id
          });
          return done(error, null);
        }
      }
    )
  );
} else {
  logger.warn('Naver OAuth 환경 변수가 설정되지 않아 Naver 로그인이 비활성화됩니다.');
}

/**
 * 사용자 정보를 세션에 직렬화
 * JWT를 사용하므로 실제로는 사용하지 않지만 Passport 요구사항
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * 세션에서 사용자 정보 역직렬화
 * JWT를 사용하므로 실제로는 사용하지 않지만 Passport 요구사항
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

