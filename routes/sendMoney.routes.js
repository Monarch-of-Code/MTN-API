const express = require("express");
const { sendMoney } = require("../controllers/sendMoney.controller");

const router = express.Router();

// ✅ Route to send money
router.post("/send-money", sendMoney);

module.exports = router;
