// payBills.middleware.js

const axios = require('axios');
require('dotenv').config();

// Authentication middleware to get MTN API token
const authenticateMTN = async (req, res, next) => {
    try {
        const auth = Buffer.from(`${process.env.MTN_DISBURSEMENT_USER_ID}:${process.env.MTN_DISBURSEMENT_API_SECRET}`).toString('base64');
        
        const response = await axios.post(process.env.MTN_AUTH_DISBURSEMENTS_URL, {}, {
            headers: {
                'X-Reference-Id': process.env.MTN_DISBURSEMENT_PRIMARY_KEY,
                'X-Target-Environment': process.env.MTN_ENVIRONMENT,
                'Authorization': `Basic ${auth}`,
                'Ocp-Apim-Subscription-Key': process.env.MTN_DISBURSEMENT_PRIMARY_KEY,
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

const validateBillPayment = (req, res, next) => {
    // Currently these fields are required from the user to enter and these will vary on the bill category. 
    // Then we can add more fields as required.
    const { billType, billerCode, billId, amount, currency = 'EUR' } = req.body;

    try {
        // Check if all required fields are provided
        if (!billType || !billerCode || !billId || !amount) {
            console.log('Validation Failed: Missing required fields');
            return res.status(400).json({ 
                status: "error", 
                message: "All fields (billType, billerCode, billId, amount) are required." 
            });
        }

        // Validate billType (should be a non-empty string)
        if (typeof billType !== 'string' || billType.trim().length === 0) {
            console.log('Validation Failed: Invalid bill type');
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid bill type. It must be a non-empty string." 
            });
        }

        // These Bill ID's digits vary on the bill category


        // Validate billerCode (should be alphanumeric)
        const billerCodeRegex = /^[A-Za-z0-9]+$/;
        if (!billerCodeRegex.test(billerCode)) {
            console.log('Validation Failed: Invalid biller code');
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid biller code. It must contain only letters and numbers." 
            });
        }

        // Validate billId (basic validation to ensure it's not empty and contains only valid characters)
        const billIdRegex = /^[A-Za-z0-9-]+$/;
        if (!billIdRegex.test(billId)) {
            console.log('Validation Failed: Invalid bill ID format');
            return res.status(400).json({ 
                status: "error", 
                message: "Your bill ID appears to be incorrect. Please check and enter a valid bill ID." 
            });
        }

        // Additional billId validation based on billType. Can change this to a switch statement if needed.
        // The digits and characters will vary based on the bill type. Can be changed.
        const billIdValidation = {
            electricity: /^\d{10,12}$/, // Example: 10-12 digits for electricity bills
            water: /^\d{8,15}$/, // Example: 8-15 digits for water bills
            internet: /^[A-Z0-9]{12,16}$/, // Example: 12-16 alphanumeric characters for internet bills
            telephone: /^\d{9,14}$/ // Example: 9-14 digits for telephone bills
        };

        if (billIdValidation[billType] && !billIdValidation[billType].test(billId)) {
            console.log(`Validation Failed: Invalid ${billType} bill ID format`);
            return res.status(400).json({ 
                status: "error", 
                message: `Your ${billType} bill ID is incorrect. Please check and enter a valid ${billType} bill ID.` 
            });
        }

        // Validate amount (should be a valid positive number with up to 2 decimal places)
        const amountRegex = /^\d+(\.\d{1,2})?$/;
        if (!amountRegex.test(amount) || Number(amount) <= 0) {
            console.log('Validation Failed: Invalid amount format');
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid amount. It must be a positive number with up to 2 decimal places." 
            });
        }

        // Validate currency if provided. For now only EUR is supported.
        const validCurrencies = ['EUR']; // Add more supported currencies as needed
        if (currency && !validCurrencies.includes(currency)) {
            console.log('Validation Failed: Invalid currency');
            return res.status(400).json({ 
                status: "error", 
                message: `Invalid currency. Supported currencies are: ${validCurrencies.join(', ')}` 
            });
        }

        // Add validated data to request
        req.validatedData = {
            billType: billType.trim(),
            billerCode,
            billId,
            amount: Number(amount).toFixed(2),
            currency
        };
        next();

    } catch (error) {
        console.error('Validation Error:', error);
        return res.status(500).json({
            status: "error", 
            message: "An error occurred during validation." 
        });
    }
};

module.exports = { validateBillPayment, authenticateMTN };
