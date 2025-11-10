/**
 * @fileoverview 프로필 컨트롤러
 * @module controllers/profileController
 */

const Profile = require('../models/Profile');
const { logActivity, ActivityType } = require('../utils/activityLogger');

/**
 * 프로필 저장 (생성 또는 업데이트)
 * @param {import('express').Request & { user: { id: string } }} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const saveProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interests, hobbies, ideal_type, ideal_life, current_job, future_dream, personality, concerns, dreams, dating_style, other_info } = req.body;

    // 기존 프로필 찾기
    let profile = await Profile.findOne({
      where: { user_id: userId }
    });

    if (profile) {
      // 프로필이 존재하면 업데이트
      await profile.update({
        interests,
        hobbies,
        ideal_type,
        ideal_life,
        current_job,
        future_dream,
        personality,
        concerns,
        dreams,
        dating_style,
        other_info
      });
      
      // 활동 로깅
      await logActivity(userId, ActivityType.PROFILE_UPDATE, {
        resourceType: 'profile',
        resourceId: profile.id,
        req
      });
      
      return res.status(200).json({
        message: '프로필이 업데이트되었습니다.',
        profile
      });
    } else {
      // 프로필이 없으면 생성
      profile = await Profile.create({
        user_id: userId,
        interests,
        hobbies,
        ideal_type,
        ideal_life,
        current_job,
        future_dream,
        personality,
        concerns,
        dreams,
        dating_style,
        other_info
      });
      
      // 활동 로깅 (프로필 생성)
      await logActivity(userId, ActivityType.PROFILE_UPDATE, {
        resourceType: 'profile',
        resourceId: profile.id,
        metadata: { action: 'create' },
        req
      });
      
      return res.status(200).json({
        message: '프로필이 생성되었습니다.',
        profile
      });
    }

  } catch (error) {
    console.error('프로필 저장 에러:', error);
    res.status(500).json({
      message: '프로필 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 프로필 조회
 * @param {import('express').Request & { user: { id: string } }} req - Express 요청 객체
 * @param {import('express').Response} res - Express 응답 객체
 * @returns {Promise<void>}
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await Profile.findOne({
      where: { user_id: userId }
    });

    return res.status(200).json({
      profile: profile || null
    });

  } catch (error) {
    console.error('프로필 조회 에러:', error);
    res.status(500).json({
      message: '프로필 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

module.exports = {
  saveProfile,
  getProfile
};

