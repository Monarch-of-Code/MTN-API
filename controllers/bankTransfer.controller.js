const axios = require('axios');
const generateUUID = require('../generateUUID');
require('dotenv').config();

// Generate UUID for X-Reference-Id
const generateReferenceId = () => generateUUID();

// Mobile Money Transfer Controller
const initiateBankTransfer = async (req, res) => {
    try {
        const { 
            payerFullName, 
            payerNumber, 
            payeeFullName, 
            payeePhoneNumber,
            amount, 
            currency = 'EUR'
        } = req.body;

        // Validate required fields
        if (!payerFullName || !payerNumber || !payeeFullName || !payeePhoneNumber) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields. Please provide payerFullName, payerNumber, payeeFullName, and payeePhoneNumber'
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

        // Validate payee phone number format
        if (!phoneRegex.test(payeePhoneNumber)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid payee phone number format. Please provide a valid phone number'
            });
        }

        const referenceId = generateReferenceId();
        
        // Prepare the transfer request
        const transferRequest = {
            amount: amount.toString(),
            currency: currency,
            externalId: referenceId,
            payer: {
                partyIdType: "MSISDN",
                partyId: payerNumber
            },
            payerMessage: `Transfer to ${payeeFullName}`,
            payeeNote: `Transfer from ${payerFullName}`,
            payee: {
                partyIdType: "MSISDN",
                partyId: payeePhoneNumber
            },
            callbackUrl: `${process.env.MTN_CALLBACK_HOST}/bank-transfer-callback`
        };

        // Log the request for debugging
        console.log('Transfer Request:', JSON.stringify(transferRequest, null, 2));

        // Make the transfer request to MTN API
        const response = await axios.post(
            `${process.env.MTN_REMITTANCES_URL}transfer`,
            transferRequest,
            {
                headers: {
                    'Authorization': `Bearer ${req.mtnToken}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': process.env.MTN_ENVIRONMENT,
                    'Ocp-Apim-Subscription-Key': process.env.MTN_REMITTANCE_PRIMARY_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json({
            status: 'success',
            message: 'Mobile money transfer initiated successfully',
            data: {
                referenceId,
                status: response.status,
                response: response.data
            }
        });

    } catch (error) {
        console.error('Transfer Error:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to initiate mobile money transfer',
            error: error.response?.data || error.message
        });
    }
};

// Get Transfer Status
const getTransferStatus = async (req, res) => {
    try {
        const { referenceId } = req.params;

        const response = await axios.get(
            `${process.env.MTN_REMITTANCES_URL}transfer/${referenceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${req.mtnToken}`,
                    'X-Target-Environment': process.env.MTN_ENVIRONMENT,
                    'Ocp-Apim-Subscription-Key': process.env.MTN_REMITTANCE_PRIMARY_KEY
                }
            }
        );

        res.status(200).json({
            status: 'success',
            data: response.data
        });

    } catch (error) {
        console.error('Get Transfer Status Error:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get transfer status',
            error: error.response?.data || error.message
        });
    }
};

module.exports = {
    initiateBankTransfer,
    getTransferStatus
};