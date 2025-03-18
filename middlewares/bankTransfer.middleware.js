const axios = require('axios');
require('dotenv').config();

// Authentication middleware to get MTN API token
const authenticateMTN = async (req, res, next) => {
    try {
        const auth = Buffer.from(`${process.env.MTN_REMITTANCE_USER_ID}:${process.env.MTN_REMITTANCE_API_SECRET}`).toString('base64');
        
        const response = await axios.post(process.env.MTN_AUTH_REMITTANCES_URL, {}, {
            headers: {
                'X-Reference-Id': process.env.MTN_REMITTANCE_PRIMARY_KEY,
                'X-Target-Environment': process.env.MTN_ENVIRONMENT,
                'Authorization': `Basic ${auth}`,
                'Ocp-Apim-Subscription-Key': process.env.MTN_REMITTANCE_PRIMARY_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data || !response.data.access_token) {
            throw new Error('No access token received from MTN API');
        }

        req.mtnToken = response.data.access_token;
        next();
    } catch (error) {
        console.error('MTN Authentication Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            status: 'error',
            message: 'Failed to authenticate with MTN API',
            error: error.response?.data || error.message
        });
    }
};

// Validation middleware for bank transfer request
const validateBankTransferRequest = (req, res, next) => {
    const { 
        payerFullName, 
        payerNumber, 
        payeeFullName, 
        payeeAccountNo, 
        payeePhoneNumber 
    } = req.body;

    // Validate required fields
    if (!payerFullName || !payerNumber || !payeeFullName) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required fields. Please provide payerFullName, payerNumber, and payeeFullName'
        });
    }

    // Validate that either payeeAccountNo or payeePhoneNumber is provided, but not both
    if (!payeeAccountNo && !payeePhoneNumber) {
        return res.status(400).json({
            status: 'error',
            message: 'Please provide either payeeAccountNo or payeePhoneNumber'
        });
    }

    if (payeeAccountNo && payeePhoneNumber) {
        return res.status(400).json({
            status: 'error',
            message: 'Please provide only one of payeeAccountNo or payeePhoneNumber, not both'
        });
    }

    // Validate payer phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(payerNumber)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid payer phone number format. Please provide a valid phone number'
        });
    }

    // Validate payee phone number if provided
    if (payeePhoneNumber && !phoneRegex.test(payeePhoneNumber)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid payee phone number format. Please provide a valid phone number'
        });
    }

    // Validate payee account number if provided (basic validation for bank account number)
    if (payeeAccountNo) {
        const accountRegex = /^[0-9]{8,17}$/; // Basic validation for bank account numbers
        if (!accountRegex.test(payeeAccountNo)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid payee account number format. Please provide a valid bank account number'
            });
        }
    }

    // Add the validated payee identifier to the request body
    req.body.payeeIdentifier = payeePhoneNumber || payeeAccountNo;
    req.body.payeeIdentifierType = payeePhoneNumber ? 'MSISDN' : 'ACCOUNT_NO';

    next();
};

module.exports = {
    authenticateMTN,
    validateBankTransferRequest
};