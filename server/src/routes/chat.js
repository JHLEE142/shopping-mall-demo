const { Router } = require('express');
const { sendChatMessage } = require('../controllers/chatController');

const router = Router();

// POST /api/chat - 채팅 메시지 전송
router.post('/', sendChatMessage);

module.exports = router;

