const Profile = require('../models/Profile');

// 프로필 저장 (생성 또는 업데이트)
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

// 프로필 조회
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

