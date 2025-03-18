const express = require("express");
const { receiveMoney } = require("../controllers/receiveMoney.controller");

const router = express.Router();

// ✅ Route to send money
router.post("/receive-money", receiveMoney);

module.exports = router;
