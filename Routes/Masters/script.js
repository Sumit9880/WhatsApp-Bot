const express = require('express');
const router = express.Router();
const scriptService = require('../../Services/Masters/script.js');

router
    .get('/get', scriptService.get)
    .post('/create', scriptService.create)
    .put('/update', scriptService.update)

module.exports = router;