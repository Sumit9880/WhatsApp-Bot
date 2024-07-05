const express = require('express');
const router = express.Router();
const contactsService = require('../../Services/Masters/contacts.js');

router
    .get('/get', contactsService.get)
    .post('/create', contactsService.create)
    .put('/update', contactsService.update)

module.exports = router;