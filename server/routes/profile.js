const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { saveProfile, getProfile } = require('../controllers/profileController');

// 프로필 저장 (POST /api/profile)
router.post('/', authMiddleware, saveProfile);

// 프로필 조회 (GET /api/profile)
router.get('/', authMiddleware, getProfile);

module.exports = router;

