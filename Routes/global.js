const express = require("express");
const router = express.Router();
var globalService = require("../Services/global");

router
  // Webhook
  .get("/webhook", require("../Services/Bot/botScript").check)
  .post("/webhook", require("../Services/Bot/botScript").handle)

  // Validation
  // .use('*', globalService.checkAuthorization)
  // .use("/api", globalService.checkToken)

  // Masters
  .use('/api/contacts', require('./Masters/contacts.js'))
  .use('/api/script', require('./Masters/script.js'))
  .use('/api/userChatHistory', require('./Masters/userChatHistory.js'))


module.exports = router;