const express = require("express");
const router = express.Router();
var globalService = require("../Services/global");

router
  // Validation
  // .use('*', globalService.checkAuthorization)
  // .use("/api", globalService.checkToken)

  // Admin
  .get("/webhook", require("../Services/Bot/botScript").check)
  .post("/webhook", require("../Services/Bot/botScript").handle)


module.exports = router;