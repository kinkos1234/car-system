const express = require('express');
const { authMiddleware: auth } = require('../middlewares/auth.middleware');
const aiCtrl = require('../controllers/ai.controller');
const router = express.Router();

// 컨트롤러 임시: 추후 분리
router.post('/summary', auth, aiCtrl.summary);
router.post('/strategy', auth, aiCtrl.strategy);

module.exports = router; 