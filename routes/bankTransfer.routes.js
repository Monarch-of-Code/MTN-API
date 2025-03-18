const express = require("express");
const router = express.Router();
const { handleBankTransfer } = require("../controllers/bankTransfer.controller");
const { validateBankTransfer } = require("../middlewares/bankTransfer.middleware"); // Import middleware

// ✅ Apply middleware to validate request before processing bank transfer
router.post("/bank-transfer", validateBankTransfer, handleBankTransfer);

module.exports = router;
