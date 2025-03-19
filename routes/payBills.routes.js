// payBills.route.js

const express = require("express");
const router = express.Router();
const { validateBillPayment, authenticateMTN } = require("../middlewares/payBills.middleware");
const { payBill, getBillPaymentStatus } = require("../controllers/payBills.controller");

// Bill payment routes with authentication
router.post("/pay", authenticateMTN, validateBillPayment, payBill);
router.get("/status/:transactionId", authenticateMTN, getBillPaymentStatus);

// Export router
module.exports = router;
