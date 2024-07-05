const express = require('express');
const router = express.Router();
const userChatHistoryService = require('../../Services/Masters/userChatHistory.js');

router
    .get('/get', userChatHistoryService.get)
    .post('/create', userChatHistoryService.create)
    .put('/update', userChatHistoryService.update)

module.exports = router;