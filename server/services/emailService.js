/**
 * @fileoverview 이메일 발송 서비스
 * nodemailer를 사용한 이메일 발송 유틸리티
 * @module services/emailService
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * 이메일 발송기 설정
 * 환경변수에서 SMTP 설정을 읽어옵니다.
 */
let transporter = null;

/**
 * 이메일 발송기 초기화
 * @returns {Promise<nodemailer.Transporter>} 이메일 발송기 인스턴스
 */
const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // 개발 환경에서는 이메일 발송을 비활성화할 수 있음
  if (process.env.EMAIL_ENABLED === 'false') {
    logger.warn('이메일 발송이 비활성화되어 있습니다.');
    return null;
  }

  // SMTP 설정
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  // SMTP 사용자 정보가 없으면 null 반환 (이메일 발송 불가)
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    logger.warn('SMTP 설정이 없어 이메일 발송을 할 수 없습니다. EMAIL_ENABLED=false로 설정하거나 SMTP 설정을 추가하세요.');
    return null;
  }

  transporter = nodemailer.createTransport(smtpConfig);
  return transporter;
};

/**
 * 이메일 인증 토큰 생성
 * @returns {string} 인증 토큰 (32자리 랜덤 문자열)
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 이메일 인증 링크 생성
 * @param {string} token - 인증 토큰
 * @returns {string} 인증 링크 URL
 */
const generateVerificationLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
  return `${baseUrl}/verify-email?token=${token}`;
};

/**
 * 이메일 인증 메일 발송
 * @param {string} to - 수신자 이메일 주소
 * @param {string} token - 인증 토큰
 * @returns {Promise<Object>} 발송 결과
 */
const sendVerificationEmail = async (to, token) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      logger.warn('이메일 발송기 없음 - 인증 메일 발송 건너뜀', { email: to });
      return { success: false, skipped: true };
    }

    const verificationLink = generateVerificationLink(token);
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'Perspec';

    const mailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to,
      subject: `${appName} 이메일 인증`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background-color: #0056b3; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>이메일 인증</h2>
            <p>안녕하세요,</p>
            <p>${appName} 회원가입을 완료하기 위해 아래 버튼을 클릭하여 이메일을 인증해주세요.</p>
            <p>
              <a href="${verificationLink}" class="button">이메일 인증하기</a>
            </p>
            <p>버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationLink}</p>
            <p>이 링크는 24시간 동안 유효합니다.</p>
            <div class="footer">
              <p>이 메일은 ${appName} 회원가입 과정에서 자동으로 발송되었습니다.</p>
              <p>만약 회원가입을 하지 않으셨다면, 이 메일을 무시하셔도 됩니다.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${appName} 이메일 인증
        
        안녕하세요,
        
        ${appName} 회원가입을 완료하기 위해 아래 링크를 클릭하여 이메일을 인증해주세요.
        
        ${verificationLink}
        
        이 링크는 24시간 동안 유효합니다.
        
        이 메일은 ${appName} 회원가입 과정에서 자동으로 발송되었습니다.
        만약 회원가입을 하지 않으셨다면, 이 메일을 무시하셔도 됩니다.
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info('이메일 인증 메일 발송 성공', {
      email: to,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('이메일 인증 메일 발송 실패', {
      email: to,
      error: error.message
    });
    throw error;
  }
};

/**
 * 비밀번호 재설정 링크 생성
 * @param {string} token - 재설정 토큰
 * @returns {string} 재설정 링크 URL
 */
const generatePasswordResetLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
  return `${baseUrl}/reset-password?token=${token}`;
};

/**
 * 비밀번호 재설정 메일 발송
 * @param {string} to - 수신자 이메일 주소
 * @param {string} token - 재설정 토큰
 * @returns {Promise<Object>} 발송 결과
 */
const sendPasswordResetEmail = async (to, token) => {
  try {
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      logger.warn('이메일 발송기 없음 - 비밀번호 재설정 메일 발송 건너뜀', { email: to });
      return { success: false, skipped: true };
    }

    const resetLink = generatePasswordResetLink(token);
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'Perspec';

    const mailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to,
      subject: `${appName} 비밀번호 재설정`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background-color: #c82333; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>비밀번호 재설정</h2>
            <p>안녕하세요,</p>
            <p>${appName} 계정의 비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
            <p>
              <a href="${resetLink}" class="button">비밀번호 재설정하기</a>
            </p>
            <p>버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
            <p style="word-break: break-all; color: #dc3545;">${resetLink}</p>
            <div class="warning">
              <strong>주의사항:</strong>
              <ul>
                <li>이 링크는 1시간 동안만 유효합니다.</li>
                <li>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하셔도 됩니다.</li>
                <li>보안을 위해 비밀번호는 정기적으로 변경하시는 것을 권장합니다.</li>
              </ul>
            </div>
            <div class="footer">
              <p>이 메일은 ${appName} 비밀번호 재설정 요청에 의해 자동으로 발송되었습니다.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${appName} 비밀번호 재설정
        
        안녕하세요,
        
        ${appName} 계정의 비밀번호 재설정을 요청하셨습니다.
        아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요.
        
        ${resetLink}
        
        주의사항:
        - 이 링크는 1시간 동안만 유효합니다.
        - 만약 비밀번호 재설정을 요청하지 않으셨다면, 이 메일을 무시하셔도 됩니다.
        - 보안을 위해 비밀번호는 정기적으로 변경하시는 것을 권장합니다.
        
        이 메일은 ${appName} 비밀번호 재설정 요청에 의해 자동으로 발송되었습니다.
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info('비밀번호 재설정 메일 발송 성공', {
      email: to,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('비밀번호 재설정 메일 발송 실패', {
      email: to,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  generateVerificationToken,
  generateVerificationLink,
  generatePasswordResetLink,
  getTransporter
};

