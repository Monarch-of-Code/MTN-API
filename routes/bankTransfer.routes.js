const express = require('express');
const router = express.Router();
const { authenticateMTN, validateBankTransferRequest } = require('../middlewares/bankTransfer.middleware');
const { initiateBankTransfer, getTransferStatus } = require('../controllers/bankTransfer.controller');

// Bank transfer routes
router.post('/transfer', 
    authenticateMTN, 
    validateBankTransferRequest, 
    initiateBankTransfer
);

router.get('/transfer/:referenceId', 
    authenticateMTN, 
    getTransferStatus
);

module.exports = router; 